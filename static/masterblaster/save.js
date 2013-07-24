$("#saveButton").click(saveButtonClick);

$('.alert .close').on('click', function () {
    $(this).parent().hide();
    history.replaceState(null,'GeoNotice',window.location.origin);
    document.title = 'GeoNotice';

})

function saveButtonClick(){
    var data = {
        'action': 'save',
        'mapstate': mapstate
    };
    masterblaster.tools.sendAction(data, callbackSave);
}

function callbackSave(data) {
    if (data.save) {
        mapstate = data.save.mapstate;
        snapshotLink = window.location.origin + "/snapshot/" +  mapstate.id;
        if (mapstate.slug.length > 0) {
            snapshotLink += "/" + mapstate.slug;
        }
        snapshotTitle = "GeoNotice Snapshot " + mapstate.id;
        if (mapstate.name && mapstate.name.length > 0) {
            snapshotTitle += " - " + mapstate.name;
        }
        mailTo = 'mailto:' + escape("<Insert Recipients Here>") 
            +"?subject=" +escape("<Insert Subject Here>") 
            +"&body=" +escape(snapshotLink);
        $('a#snapshot-link').attr('href', snapshotLink);
        $('a#snapshot-mailto').attr('href', mailTo);
        $('a#snapshot-link').text(snapshotLink);
        history.replaceState(null,snapshotTitle,snapshotLink);
        document.title = snapshotTitle;
        $('div#save-success').fadeIn();
    }
}
