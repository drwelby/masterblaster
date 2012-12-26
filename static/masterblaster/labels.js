$('#apnbox').click(function() {
    var changed = $(this);
    a = $('a#pdflink');
    if (changed.is(':checked')) {
        $('span.apn').show();
        a.attr('href', a.attr('href').replace('&apn=0', '&apn=1'));
    } else {
        $('span.apn').hide();
        a.attr('href', a.attr('href').replace('&apn=1', '&apn=0'));
    }
});

$('#uniquebox').click(function() {
    var changed = $(this);
    a = $('a#pdflink');
    if (changed.is(':checked')) {
        a.attr('href', a.attr('href').replace('&unique=0', '&unique=1'));
    } else {
        a.attr('href', a.attr('href').replace('&unique=1', '&unique=0'));
    }
});

$('#optionsSitus').click(function() {
        $('span.mail').hide();
        $('span.situs').show();
        a = $('a#pdflink');
        a.attr('href', a.attr('href').replace('&address=mail', '&address=situs'));
});

$('#optionsMail').click(function() {
        $('span.situs').hide();
        $('span.mail').show();
        a = $('a#pdflink');
        a.attr('href', a.attr('href').replace('&address=situs', '&address=mail'));
});
