/*global EditView*/
/*global ViewSourceView*/
/*global ActionMenuView*/
/*global SettingsView*/
/*global AppendChildView*/
/*global MainView*/

/*global EditController*/
/*global ViewSourceController*/
/*global ActionMenuController*/
/*global SettingsController*/
/*global AppendChildController*/
/*global MainController*/

var editView = new EditView();
var actionMenuView = new ActionMenuView();
var settingsView = new SettingsView();
var viewSourceView = new ViewSourceView();
var appendChildView = new AppendChildView();
var mainView = new MainView({
  editView: editView,
  actionMenuView: actionMenuView,
  settingsView: settingsView,
  viewSourceView: viewSourceView,
  appendChildView: appendChildView
});

var editController = new EditController({
  view: editView
});

var viewSourceController = new ViewSourceController({
  view: viewSourceView
});

var appendChildController = new AppendChildController({
  view: appendChildView
});

var actionMenuController = new ActionMenuController({
  view: actionMenuView,
  editController: editController,
  viewSourceController: viewSourceController,
  appendChildController: appendChildController
});

var settingsController = new SettingsController({
  view: settingsView
});

var mainController = new MainController({
  view: mainView,

  actionMenuController: actionMenuController,
  settingsController: settingsController
});

editController.mainController = mainController;
viewSourceController.mainController = mainController;
actionMenuController.mainController = mainController;
settingsController.mainController = mainController;
appendChildController.mainController = mainController;

window.mainController = mainController;
