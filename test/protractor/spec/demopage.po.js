

var DemoPage = function() {
  return {
    skipLogicSource: element(by.id('/Your_Health_Information/pWj94_qVzz_/1/1')),
    skipLogicTarget1: element(by.id('/Your_Health_Information/Alcohol_Use/5tds2-CyWgt/1/1/1')),
    skipLogicTarget2: element(by.id('/Your_Health_Information/Alcohol_Use/vfSZy6m4c7o/1/1/1')),
    panelTitle: element(by.css('h3')),
    formSelector: element(by.id('formSelector')),
    helpButton: element.all(by.css('button.help-button')).first(),
    instructions: element(by.css('div.popover-inner')),
    displayCodeCheckbox: element.all(by.css('div.col-md-3.col-xs-3 label input[type="checkbox"]')).first(),
    loincCodeLabel: element(by.cssContainingText('div.name-label > span.item-code > span', '[66773-3]')),
    itemIntType: element(by.id('/Your_Disease_History/-dZecSUoNVD/1/1')),
    itemNumberType: element(by.id('/Your_Health_Information/z93OErjdWOh/1/1')),
    itemRequired: element(by.id('/Your_Health_Information/tXwaaWzu1Od/1/1')),
    itemRequiredPopup: element(by.cssContainingText('div.errorRequired', '"Person Height Value" requires a value.'))

  };
};
module.exports = DemoPage();
