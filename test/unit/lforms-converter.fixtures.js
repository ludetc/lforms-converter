/**
 * Created by akanduru on 11/12/15.
 */

// Used to test traverseItems().
var lformsConverterItemTraversalTree = { //Root
  visit: 1,
  expectedPath: [],
  items: [
    { // [0]
      visit: 2,
      expectedPath: [0],
      items: [
        { //[0][0]
          visit: 3,
          expectedPath: [0,0],
          a: 1
        }
      ],
      b: 2
    },
    { //[1]
      visit: 4,
      expectedPath: [1],
      items: [
        { //[1][0]
          visit: 5,
          expectedPath: [1,0],
          c: "ccccc"
        },
        { //[1][1]
          visit: 6,
          expectedPath: [1,1],
          d: "dddddddd"
        }
      ]
    }
  ],
  f: {
    g: {
      h: {
        i: 3
      },
      j: [
        4,5,6,7
      ]
    },
    k: {
      l: 8
    }
  },
  m: 'mmmmmmm',
  n: 'nnnnnnn'
};

// Used to pass the test for traverseItemsUpside()
var testNodeForUpsideTraversal6 = {
  startingNode: lformsConverterItemTraversalTree.items[1].items[1],
  ancestors: [
    {
      parent: lformsConverterItemTraversalTree,
      thisIndex: 1
    },
    {
      parent: lformsConverterItemTraversalTree.items[1],
      thisIndex: 1
    }
  ]
};

// Used to test throwing of exception for traverseItemsUpside()
var testNodeForUpsideTraversalFail = {
  startingNode: lformsConverterItemTraversalTree.items[1].items[1],
  ancestors: [
    {
      parent: lformsConverterItemTraversalTree,
      thisIndex: 0
    },
    {
      parent: lformsConverterItemTraversalTree.f.g,
      thisIndex: 0
    }
  ]
};
