$('#apnbox').click(function() {
    var changed = $(this);
    if (changed.is(':checked')) {
        $('span.apn').show();
    } else {
        $('span.apn').hide();
    }
});

$('#optionsSitus').click(function() {
        $('span.mail').hide();
        $('span.situs').show();
});

$('#optionsMail').click(function() {
        $('span.situs').hide();
        $('span.mail').show();
});
