/**
 *
 * Uses a json streaming parser (oboe) to fetch and transform the input from
 * a specified source.
 */
'use strict';

/**
 *
 * Class definition
 */

var   LformsConverter = function() {};

_.extend(LformsConverter.prototype, {

  /**
   *  API to initiate the parsing
   *  @param: {String} urlStr - Source of json input source, either a filename or url
   */
  transform: function (urlStr, successCallback, failCallback) {
    var self = this;
    self.parse(urlStr, successCallback, failCallback);
  },


  /**
   * Parsing cde json from the input source.
   *
   * @param {Object} inputSource - A ReadableStream object, typically obtained
   * from file stream or http response object.
   */
  parse: function(inputSource, successCallback, failCallback) {
    var self = this;

    // Setup handlers based on json path expressions.
    var parser = oboe(inputSource)
      .node({
        'noRenderAllowed': this.handle_no_render_allowed.bind(this),
        'formElements.*': this.handle_form_element.bind(this),
        'naming': this.handle_naming.bind(this),
        'cardinality': this.handle_cardinality.bind(this),
        'answers.*': this.handle_answers.bind(this),
        'uoms.*': this.handle_units.bind(this),
        // List out ignorables
        '__v': oboe.drop,
        'attachments': oboe.drop,
        'classification': oboe.drop,
        'comments': oboe.drop,
        'created': oboe.drop,
        'createdBy': oboe.drop,
        'history': oboe.drop,
        'ids': oboe.drop,
        'isCopyrighted': oboe.drop,
        'properties': oboe.drop,
        'referenceDocuments': oboe.drop,
        'registrationState': oboe.drop
      })
      // Do final adjustments to the structure.
      .done(function(json){
        json.code = json._id;
        json.type = json.stewardOrg.name;
        delete json.stewardOrg;
        json.template = 'panelTableV';
        rename_key(json, 'naming', 'name');
        rename_key(json, 'formElements', 'items');
        // Convert skip logic.
        doSkipLogic(json);
        // Remove any undefined
        removeArrayElements(json, undefined);
        successCallback(json);
      })
      .fail(function(errorReport) {
        // Something is wrong. Abort further parsing and throw the error
        errorReport.statusCode = errorReport.statusCode ? errorReport.statusCode :
                                 (errorReport.thrown ? errorReport.thrown.statusCode : 500);
        errorReport.body = errorReport.body ||
                                 (errorReport.thrown ? errorReport.thrown.message : undefined);
        parser.abort();
        if(failCallback) {
          failCallback(errorReport);
        }
      });
  },


  /**
   ************************************************************************
   ************ Oboe Node Handlers ****************************************
   ************************************************************************
   * All handlers have the following signature.
   * @param: param Object representing node resulting from jsonpath expression.
   * Anny modification to param reflects in the output json.
   *
   * @param path: Array of path elements to this param.
   *
   * @return: Any return value replaces param in the result json tree.
   ************************************************************************
   */

  /**
   * Look for noRenderAllowed flag. If present throw forbidden error.
   *
   * Some of the CDE forms are not allowed to render for reasons such as
   * copyrights issues.
   *
   * CDE web interface generally avoids sending the traffic for these forms.
   * However somebody could still use the id of such forms to render them,
   * hence the check here.
   *
   * @param {boolean} param - noRenderAllowed
   * @param {Array} path - path of param
   *
   */
  handle_no_render_allowed: function(param, path) {
    if(param) {
      var err = new Error('Form not allowed to render');
      err.statusCode = 403;
      delete err.stack; // Suppress error stack
      throw err;
    }
  },


  /**
   * Handle form name
   * @param {Object} param - naming
   * @param {Array} path - path of param
   */
  handle_naming: function(param, path) {
    if(param && param.length > 0) {
      return param[0].designation;
    }
    else {
      return oboe.drop();
    }
  },


  /**
   * formElement => item
   * @param param {Object} param - formElements.*
   * @param path {Array} path - path of param
   */
  handle_form_element: function(param, path) {
    try {
      // Makeup a code
      var code = createQuestionCode(param);
      if (code === null) {
        // Can't create code if the element does not meet minimum requirements.
        return oboe.drop();
      }

      param.questionCode = code;
      // cde question is different than item.question.
      var q = param.question;
      // cde label is item.question
      param.question = param.label;
      delete param.label;
      // cde element type determines item.header
      param.header = false;
      if (param.elementType === 'section') {
        param.header = true;
      }
      delete param.elementType;

      // Map datatype
      param.dataType = createDataType(q);
      // Move all answerlists to its own hash
      if (q && q.answers && q.answers.length > 0) {
        param.answers = q.answers;
      }

      // Handle units
      if (q && q.uoms && q.uoms.length > 0) {
        param.units = q.uoms;
        // Make first unit the default.
        param.units[0].default = true;
      }
      // Content of param are already changed. Change the key names if any
      rename_key(param, 'formElements', 'items');
      rename_key(param, 'cardinality', 'questionCardinality');

      return param;
    }
    catch(err) {
      err.param = JSON.stringify(param, null, '  ');
      err.path = path;
      throw err;
    }
  },


  /**
   * Input is separated by period if for min and max. Otherwise min == max.
   *
   * @param {Object} param - cardinality
   * @param {Array} path - path of param
  */
  handle_cardinality: function(param, path) {
    var ret = {};
    var a = param.split('.');
    if(a.length > 1) {
      a[0] = (a[0] === '*' ? -1 : parseInt(a[0]));
      a[1] = (a[1] === '*' ? -1 : parseInt(a[1]));
      ret.min = a[0];
      ret.max = a[1];
    }
    else {
      if (param === '*') {
        ret.min = 0;
        ret.max = -1;
      }
      else {
        ret.min = parseInt(param);
        ret.max = parseInt(param);
      }
    }
    return ret;
  },


  /**
   * Units
   *
   * @param {Object} param - uoms.*
   * @param {Array} path - path of param
   */
  handle_units: function(param, path) {
    var ret = {};
    ret.name = param;
    return ret;
  },


  /**
   * Handle answerlist
   *
   * @param {Object} param - answers.*
   * @param {Array} path - path of param
   */
  handle_answers: function(param, path) {
    rename_key(param, 'permissibleValue', 'code');
    rename_key(param, 'valueMeaningName', 'text');
    return param;
  }

});

/**
 ****************************************************************************
 * Some utility functions
 ****************************************************************************
 */


/**
 * @param {Object} obj - Object whose keys are renamed.
 * @param {String} oldkey
 * @param {String} newkey
 * @returns none
 */
function  rename_key(obj, oldkey, newkey) {
  if(obj[oldkey]) {
    obj[newkey] = obj[oldkey];
    delete obj[oldkey];
  }
}

/**
 * Use tinyId for question code. Section headers do not have
 * an id.
 *
 * @param {Object} param - formElement
 */
function createQuestionCode(param) {
  var ret = '';
  if(param.elementType === 'section') {
    // No id for headers. Make up something.
    ret = param.label.replace(/\s/g, '_');
  }
  else if (param.elementType === 'question') {
    ret = param.question.cde.tinyId;
  }
  else {
    ret = null;
  }
  return ret;
}


/**
 * Convert known data types
 * @param {Object} question - formElement.question
 */
function createDataType(question) {
  var ret = '';
  if(question) {
    switch(question.datatype) {
      case 'Character':
        ret = 'ST';
        break;
      case 'Value List':
        ret = 'CNE';
        break;
      case 'NUMBER':
        ret = 'REAL';
        break;
      case 'Float':
        ret = 'REAL';
        break;
      case 'Date':
        ret = 'DT';
        break;
      default:
        ret = 'ST';
        break;
    }
  }
  return ret;
}


/**
 * Convert skip logic object to our format.
 *
 * @param {Object} root - The object returned after 'oboe' parsing.
 * @returns {undefined}
 */
function doSkipLogic(root) {
  traverse(root).forEach(function(targetItem) {
    if(this.key === 'skipLogic') {
      // This is target item. Parse 'condition' to look for source item
      var tokens = targetItem.condition.split('=');
      tokens = _.each(tokens, function(a, ind, arr) {
          arr[ind] = a.replace(/^[\s\"]*|[\s\"]*$/g, '');
      });
      var text = tokens[0];
      var value = tokens[1];
      var sourceItem;
      traverse(root).forEach(function(source) {
        if(source.question === text) {
          sourceItem = source;
          // Found the item and need to stop further iterations,
          // but I can't find a plain method to stop. Use
          // update(.., true) with unchanged value as a workaround.
          this.update(source, true);
        }
      });

      if(sourceItem) {
        this.update(createSkipLogic(value, sourceItem));
      }
    }
  });
}


/**
 * Create skipLogic object based on datatype.
 *
 * @param {String|Number|Date|Object} value - Type depends on the dataType
 * @param {Object} sourceItem - Source of skip logic to get data type and code.
 * @returns {Object} Skip logic object
 */
function createSkipLogic(value, sourceItem) {
  // Build skip logic object
  var ret = {action: 'show', conditions: [{source: sourceItem.questionCode, trigger: {} }]};

  switch(sourceItem.dataType) {
    case 'CWE':
    case 'CNE':
      ret.conditions[0].trigger.text = value;
      break;
    case 'REAL':
      ret.conditions[0].trigger.value = parseFloat(value);
      break;
    case 'DT':
      ret.conditions[0].trigger.value = value.toString();
      break;
    default:
      ret.conditions[0].trigger.value = value;
  }

  return ret;
}


/**
 * Utility to remove any array elements, traversing in a tree.
 *
 * Mainly intended to remove undefined in arrays generated out of oboe.drop during its
 * parsing. See http://oboejs.com/api#dropping-nodes on why it does that. This is
 * a change from version 2.0.2 to 2.1.2.
 *
 * @param {Object} obj - Tree from which to weed out the 'elem'
 * @param elem -
 */
function removeArrayElements(obj, elem) {
  traverse(obj).forEach(function(x) {
    if(x instanceof Array) {
      _.remove(x, function(n) {
        if(n === elem) {
          return true;
        }
//        return n === elem;
      });
    }
  });
}


/**
 * Utility to check url for oboe. Oboe supports only http and https urls.
 *
 * @param aUrl {String}
 * @returns {boolean}
 */
function isHttpUrl(aUrl) {
  var ret = true;
  if (aUrl.search(/https?:\/\//) !== 0) {
    ret = false;
  }

  return ret;
}

