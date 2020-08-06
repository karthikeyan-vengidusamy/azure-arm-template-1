﻿var isFreshLoad = true;

$(document).ready(function () {
    $.validator.addMethod("isValidName", function (value, element) {
        return IsValidName("name", value)
    }, window.Server.App.LocalizationContent.AvoidSpecialCharactors);

    $.validator.addMethod("isRequired", function (value, element) {
        return !isEmptyOrWhitespace(value);
    }, window.Server.App.LocalizationContent.ItemNameValidator);

    $.validator.addMethod("isValidGroupIsolationCode", function (value, element) {
        return ValidateIsolationCode(value);
    }, window.Server.App.LocalizationContent.IsolationCodeValidator);

    $(".group-form").validate({
        errorElement: "span",
        onkeyup: function (element) { $(element).valid(); },
        onfocusout: function (element) { $(element).valid(); },
        rules: {
            "groupname": {
                isRequired: true,
                isValidName: true
            },
            "groupisolationcode": {
                isValidGroupIsolationCode: true
            }
        },
        highlight: function (element) {
            $(element).closest("div").addClass("has-error");
            $("#group-info-name").attr("placeholder", window.Server.App.LocalizationContent.Group);
        },
        unhighlight: function (element) {
            $(element).closest("div").removeClass("has-error");
            $(element).closest("div").find("span").html("");
        },
        errorPlacement: function (error, element) {
            $(element).closest("div").find("span").html(error.html());
        },
        messages: {
            "groupname": {
                isRequired: window.Server.App.LocalizationContent.GroupNameValidator
            }
        }
    });

    $("#user-list").selectpicker();
    addPlacehoder("#search-area");
    addPlacehoder("#group-name");
    $(document).on("click", "#new-group-button", function () {
        eDialog = $("#new-group-area").data("ejDialog");
        eDialog.open();
        $("#new-group-iframe").attr("src", addGroupViewUrl);
        $("#new-group-area-wrapper").ejWaitingPopup("show");
    });

    $(document).on("change", "#user-list", function () {
        var userVal = $("#user-list").val();
        if (userVal != null)
            $("#user-save-button").attr("disabled", false);
        else
            $("#user-save-button").attr("disabled", true);
    });

    if ($("#user-list option").length > 0) {
        $("#user-list-container .bs-deselect-all").after("<div class='bs-select-all-custom'><span>" + window.Server.App.LocalizationContent.Select + "</span><span class='bs-select-custom-tick glyphicon glyphicon-ok'></span></div>");
    }
    else {
        $("#user-list-container .bs-deselect-all").after("<span class='noResult'>" + window.Server.App.LocalizationContent.NoResult + "</span>");
    }

    $("#user-list-container").on('click', ".bs-select-all-custom", function (e) {
        $("#user-list-container").addClass("value-changed");
        $("#user-list").data("selectpicker").selectAll();
        $(this).removeClass("bs-select-all-custom").addClass("bs-deselect-all-custom");
        $($(this).children("span")[0]).text(window.Server.App.LocalizationContent.Clear);
        e.stopPropagation();
    });

    $("#user-list-container").on('click', ".bs-deselect-all-custom", function (e) {
        $("#user-list-container").addClass("value-changed");
        $("#user-list").data("selectpicker").deselectAll();
        $(this).removeClass("bs-deselect-all-custom").addClass("bs-select-all-custom");
        $($(this).children("span")[0]).text(window.Server.App.LocalizationContent.Select);
        e.stopPropagation();
    });

    $("#user-list-container").on('click', ".bootstrap-select li a", function (e) {
        $("#user-list-container").addClass("value-changed");
        var selectedCount = $("#user-list-container .bootstrap-select li.selected").length;
        var allListCount = $("#user-list-container .bootstrap-select li").length;

        if (selectedCount == allListCount) {
            $($("#user-list-container div.bs-select-all-custom").children("span")[0]).text(window.Server.App.LocalizationContent.Clear);
            $("#user-list-container div.bs-select-all-custom").removeClass("bs-select-all-custom").addClass("bs-deselect-all-custom");
        }
        else {
            $($("#user-list-container .bs-deselect-all-custom").children("span")[0]).text(window.Server.App.LocalizationContent.Select);
            $("#user-list-container .bs-deselect-all-custom").removeClass("bs-deselect-all-custom").addClass("bs-select-all-custom");
        }
        e.stopPropagation();
    });

    $(document).on('click', "#group-title-container-save-button", function (e) {
        $("#group-edit-confirmation").html("");
        var groupName = $("#group-info-name").val().trim();
        $("#group-info-name").closest("div").removeClass("has-error");
        var isValid = $(".group-form").valid();

        if (isValid) {
            $("#invalid-groupname").css("display", "none");
            showWaitingPopup($("#base-container"));
            doAjaxPost("POST", saveGroupSettingsUrl, { groupInfo: JSON.stringify({ "GroupName": $("#group-info-name").val(), "GroupColor": "", "GroupDescription": $("#group-info-description").val(), "IsolationCode": $("#group-info-isolation-code").val(), "GroupId": $("#hidden-group-id").val() }) },
                function (data) {
                    hideWaitingPopup($("#base-container"));
                    if (data.status) {
                        messageBox("su-edit", window.Server.App.LocalizationContent.EditGroup, window.Server.App.LocalizationContent.EditGroupSuccess, "success", function () {
                            var scope = angular.element($("#base-container")).scope();
                            scope.$apply(function () {
                                scope.allGroupDetails.GroupName = $("#group-info-name").val();
                            });
                            onCloseMessageBox();
                        });
                    } else {
                        if (data.key == "name") {
                            $("#invalid-groupname").html(window.Server.App.LocalizationContent.IsGroupExist).css("display", "block");
                            $("#group-info-name").closest("div").addClass("has-error");
                        }
                        else
                            $("#group-edit-confirmation").html(data.value);
                    }
                }
            );
        }
    });

    $(document).on('click', ".delete", function (e) {
        var groupId = $(this).attr("data-groupid");
        var groupName = $(this).attr("data-groupname");
        eDialog = $("#delete-group-area").data("ejDialog");
        eDialog.open();
        $("#delete-group-iframe").attr("src", deleteGroupViewUrl + "?group=" + groupId + "&name=" + groupName);
        $("#delete-group-area_wrapper").ejWaitingPopup("show");
    });

    $(document).on('click', ".delete-user", function (e) {
        var userId = $(this).attr("data-userid");
        var userName = $(this).attr("data-username");
        eDialog = $("#delete-group-area").data("ejDialog");
        eDialog.open();
        $("#delete-group-iframe").attr("src", deleteGroupUserViewUrl + "?userId=" + userId + "&groupId=" + $("#hidden-group-id").val() + "&userName=" + userName);
        $("#delete-group-area_wrapper").ejWaitingPopup("show");
    });

    $(document).on('click', "#user-save-button", function (e) {
        showWaitingPopup($("#user-save-button"));
        doAjaxPost("POST", addUserInGroupUrl, { groupId: $("#hidden-group-id").val(), userId: JSON.stringify($("#user-list").val()) },
                   function (data) {
                       hideWaitingPopup($("#user-save-button"));
                       if (data == "True") {
                           $("#user-list").find("option:selected").remove();
                           $("#user-list").selectpicker("refresh");
                           if ($("#user-list option").length > 0) {
                               $("#user-list-container div.bs-deselect-all-custom").removeClass("bs-deselect-all-custom").addClass("bs-select-all-custom");
                               $("#user-list-container div.bs-select-all-custom").children("span:eq(0)").text(window.Server.App.LocalizationContent.Select);
                           }
                           else {
                               $("#user-list-container div.bs-deselect-all-custom").hide();
                               $("#user-list-container .bs-deselect-all").after("<span class='noResult'>" + window.Server.App.LocalizationContent.NoResult + "</span>");
                               $(".bootstrap-select").trigger("click");
                           }
                           var gridObj = $("#Grid").ejGrid("instance");
                           RefreshGroupUsers($("#hidden-group-id").val(), gridObj);
                       }
                   }
              );
    });
    //Add placeholder for search box in userselect in edit group.
    $("#people-container #user-list-container .bootstrap-select .bs-searchbox .input-block-level").attr("placeholder", window.Server.App.LocalizationContent.SearchUsers);


    window.addEventListener("popstate", function (e) {
        var query = window.location.search;
        if (query.contains("?tab=general")) {
            $("#group-general").attr("href", "#group-general-tab");
            $('a[href="#group-general-tab"]').tab("show");
        }
        else if (query.contains("?tab=attributes")) {
            $("#group-attribute").attr("href", "#group-attribute-tab");
            $('a[href="#group-attribute-tab"]').tab("show");
        }
        else {
            $("#group-general").attr("href", "#group-general-tab");
            $('a[href="#group-general-tab"]').tab("show");
        }
    });
});

function RefreshGroupUsers(groupId, gridObj) {
    gridObj.refreshContent();
}

function fnOnEditGroupActionBegin(args) {
    var searchValue = $("#search-group-users").val();
    this.model.query._params.push({ key: "searchKey", value: searchValue });
    var filerSettings = [], i;
    var itemGridWaitingPopupTemplateId = createLoader("Grid");
    this.element.ejWaitingPopup({ template: $("#" + itemGridWaitingPopupTemplateId) });
    if (args.model.filterSettings.filteredColumns.length > 0) {
        
        for (i = 0; i < args.model.filterSettings.filteredColumns.length; i++) {
            var column = args.model.filterSettings.filteredColumns[i];
            filerSettings.push({ 'PropertyName': column.field, 'FilterType': column.operator, 'FilterKey': column.value });
        }

        this.model.query._params.push({ key: "filterCollection", value: filerSettings });
    }
}

function fnOnUserGridActionComplete(args) {
    $('[data-toggle="tooltip"]').tooltip();

    showOrHideGridPager("#Grid");
}

$(document).on("click", ".search-group-users", function () {
    var gridObj = $("#Grid").data("ejGrid");
    gridObj.model.pageSettings.currentPage = 1;
    gridObj.refreshContent();
});
$(document).on('hide.bs.dropdown', "#people-container", function (e) {
    if ($("#people-container").hasClass("value-changed")) {
        $("#people-container").removeClass("value-changed");
        e.preventDefault();
    }
});
$(document).on("change", "#user-list", function () {
    $("#people-container").addClass("value-changed");
});

$(document).on("shown.bs.tab", 'a[data-toggle="tab"]', function (e) {
    var target = $(e.target).attr("href"); // activated tab
    var data;

    if (target.indexOf("#group-general-tab") !== -1) {
        data = "general";
    }
    else if (target.indexOf("#group-attribute-tab") !== -1) {
        data = "attributes";
    }
    pushUrl(data);
});

function pushUrl(data) {
    if (isFreshLoad) {
        history.replaceState(data, null, window.location.pathname + "?tab=" + data);
        isFreshLoad = false;
    }
    else {
        history.pushState(data, null, window.location.pathname + "?tab=" + data);
    }
}