/**
 * Created by akanduru on 9/16/15.
 */
'use strict';

describe('Test lforms-converter', function() {
  var converter = null;

  it('should fetch and convert test/test-cde.json', function(done) {
    converter = new LFormsConverter();
    converter.convert('test/test-cde.json', function(lfData) {
      expect(lfData.items.length).toEqual(2);
      expect(lfData.items[0].items.length).toEqual(8);
      expect(lfData.items[1].items.length).toEqual(2);
      expect(lfData.type).toEqual('CDE'); // Default

      done();
    }, function(err) {
      done(err);
    });
  });

  it('should do with caller supplied fields', function(done) {
    converter = new LFormsConverter();
    var options = {type: 'XXXXX', template: 'lformsPanelH'};
    converter.convert('test/test-cde.json', function(lfData) {
      expect(lfData.type).toEqual('XXXXX');
      expect(lfData.template).toEqual('panelTableH');

      done();
    }, function(err) {
      done(err);
    }, {type: 'XXXXX', template: 'panelTableH'});
  });


  it('should test traverseItems() ', function() {
    var visit = [];

    traverseItems(lformsConverterItemTraversalTree, function(x, ancestors) {
      visit.push(x.visit);
      expect(x.expectedPath).toEqual(_.pluck(ancestors, 'thisIndex'));
    }, []);

    expect(visit).toEqual([1,2,3,4,5,6]);

  });

  describe('should test traverseItemsUpside() ', function() {

    it('should pass with valid input', function() {
      var visit = [];
      traverseItemsUpside(testNodeForUpsideTraversal6.startingNode, function(x) {
        visit.push(x.visit);
      }, testNodeForUpsideTraversal6.ancestors);

      expect(visit).toEqual([6,5,4,2,1]);
    });

    it('should throw error with invalid starting node', function() {
      expect(function () {traverseItemsUpside(testNodeForUpsideTraversalFail.startingNode, function(x) {
      }, testNodeForUpsideTraversalFail.ancestors)}).toThrow(new TypeError('Invalid ancestral path'));
    });
  });
});