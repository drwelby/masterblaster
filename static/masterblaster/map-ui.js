function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

var csrftoken = getCookie('csrftoken');

function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}
$.ajaxSetup({
    crossDomain: false, // obviates need for sameOrigin test
    beforeSend: function(xhr, settings) {
        if (!csrfSafeMethod(settings.type)) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }
});


//set up nav buttons
$("#nav-tools").click(toolsClick);

//set up tools buttons
$("#clearMap").click(clearMap);
$("#pdfMapButton").click(pdfMapClick);
$("#exportButton").click(exportClick);

//set up output buttons
$("#labelButton").click(labelButtonClick);
$("#tableButton").click(tableButtonClick);
$("#excelButton").click(excelButtonClick);
$("#csvButton").click(csvButtonClick);
$("#getLabelButton").click(getLabelButtonClick);
$("#data-table .closer").click(closeDataTable);
$('#data-container').click(closeDataTable);


// do we need this any more?
$.fn.editableform.buttons = 
'<button type="submit" class="btn btn-primary editable-submit btn-mini"><i class="icon-ok icon-white"></i></button>' +
'<button type="button" class="btn editable-cancel btn-mini"><i class="icon-remove"></i></button>'; 

$("#map-title-editable").editable({
    type:'text',
    placement:'bottom',
    mode:'inline',
    onblur   : 'submit',
    emptytext: "name this project",
    url: function(params) {
        mapstate.name = params.value;
        console.log(params);
        $('div#save-needsname').fadeOut();
        return true;
    },
    value: ""
});

$("#map-title-editable").on('hidden', function(e,reason) {
        $('i.fade').toggle();
});
$("#map-title-editable").on('shown', function(e,reason) {
        $('i.fade').toggle();
});
    
updatePageState();

// Map Events
map.on('click', function(e) { $('div#save-confirm').hide(); });
map.on('moveend', updateBounds);

function updateBounds() {
    mapstate.zoom = map.getZoom();
    center = map.getCenter();
    mapstate.center = [center.lat,center.lng];
}

function updatePageState() {
    updateMapState();
    if (mapstate.selected.length > 0 ){
        $('#dataButton.disabled').on('click', dataButtonClick).removeClass('disabled');
    } else {
        $('#dataButton:not(.disabled)').off('click').addClass('disabled');
    }
}


function updateTable(){
    $('#data-table table tbody tr').remove();
    if (Object.keys(mapstate.selected).length == 0) {
        $('#data-table table tbody').append('<tr><td colspan="4">(No Parcels Selected)</td></tr>');
    }
    for (var apn in mapstate.selected) {
        $('#data-table table tbody').append('<tr>');
        p = mapstate.selected[apn].properties;
        row = $('#data-table table tr:last');
        row.append($('<td>').text(p.apn));
        row.append($('<td>').text(p.owner));
        row.append($('<td>').text(p.situs1));
        row.append($('<td>').text(p.mail1 + " " + p.mail2));
    }
}

function selectionMapState() {
    msdata = jQuery.extend(true,{},mapstate);
    delete msdata.selection;
    delete msdata.buffer;
    for (var apn in msdata.selected) {
        delete msdata.selected[apn].geometry;
        delete msdata.selected[apn].type;
    }
    return msdata;
}

function pdfMapState() {
    msdata = jQuery.extend(true,{},mapstate);
    for (var apn in msdata.selected) {
        delete msdata.selected[apn].properties
    }
    for (var apn in msdata.selection) {
        delete msdata.selected[apn].properties
    }
    return msdata;
}

function clearMap() {
    mapstate.selected = {};
    mapstate.selection = {};
    mapstate.buffer = {};
    updatePageState();
}

function toolsClick() {
    $('#map-actions').toggle();
    masterblaster.tools.resetActive();
    $('div.leaflet-top.leaflet-left').toggleClass('leaflet-extra-left');
}

function exportClick() {
    updateTable();
    masterblaster.tools.resetActive();
    $('#data-container').show();
    $('#data-table').show();
    $('input[class=csrf]').val(csrftoken);
    $('input[class=data]').val(JSON.stringify(selectionMapState()));
}

function closeDataTable() {
    $('#data-container').hide();
    $('#data-table').hide();
}

function saveClick(){
    var data = {
        'action': 'save',
        'mapstate': mapstate
    };
    sendAction(data);
}


function labelButtonClick() {
    hidden = $('#label-actions').toggle().is(":hidden")
    formh = $('form#label-actions').height() + 10;
    if (!hidden) {
        $('#table-container').css('margin-top', formh + "px")
    }else{
        $('#table-container').css('margin-top', "0px")
    }
    $('#lasso').removeClass('btn-primary');
}

function tableButtonClick(){
    getData('pdf');
}

function csvButtonClick() {
    getData('csv');
}

function excelButtonClick() {
    getData('xls');
}

function getData(filetype) {
    $('input[id=filetype]').val(filetype);
    $('form#dataform').submit();
}

function getLabelButtonClick() {
    $('form#label-actions').submit();
}

function pdfMapClick() {
    $('input[class=csrf]').val(csrftoken);
    $('#pdfform input[class=data]').val(JSON.stringify(pdfMapState()));
    $('form#pdfform').submit();
}
