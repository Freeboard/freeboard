  function attachWidgetEditIcons(element) {
    $(element).hover(function() {
      showWidgetEditIcons(this, true);
    }, function() {
      showWidgetEditIcons(this, false);
    });
  }

  function showWidgetEditIcons(element, show) {
    if(show) {
      $(element).find(".sub-section-tools").fadeIn(250);
    }
    else {
      $(element).find(".sub-section-tools").fadeOut(250);
    }
  }
  ko.bindingHandlers.widget = {
    init  : function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
      if(theFreeboardModel.isEditing()) {
        attachWidgetEditIcons($(element).parent());
      }
    },
    update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
      if(viewModel.shouldRender()) {
        $(element).empty();
        viewModel.render(element);
      }
    }
  }

