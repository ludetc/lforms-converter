

var DemoPage = function() {
  return {
    skipLogicSource: element(by.id('/Your_Health_Information/pWj94_qVzz_/1/1')),
    skipLogicTarget1: element(by.id('/Your_Health_Information/Alcohol_Use/5tds2-CyWgt/1/1/1')),
    skipLogicTarget2: element(by.id('/Your_Health_Information/Alcohol_Use/vfSZy6m4c7o/1/1/1')),
    panelTitle: element(by.css('h3')),
    formSelector: element(by.id('formSelector')),
    helpButton: element.all(by.css('button.help-button')).first(),
    instructions: element(by.css('div.popover-inner'))
  };
};
module.exports = DemoPage();
