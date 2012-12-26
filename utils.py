from django.http import HttpResponse
from pdflabels import PDFLabel
import xlwt

def xls_response(parcels, name):
    xls = xlwt.Workbook()
    ws = xls.add_sheet('Notification')
    for c, txt in enumerate(('APN', 'OWNER', 'MAILING_1', 'MAILING_2', 'SITUS_1', 'SITUS_2')):
        ws.write(0,c,txt)
    r = 1
    for parcel in parcels:
        ws.write(r,0,parcel.apn)
        ws.write(r,1,parcel.owner)
        ws.write(r,2,parcel.mail1)
        ws.write(r,3,parcel.mail2)
        ws.write(r,4,parcel.situs1)
        ws.write(r,5,parcel.situs2)
        r += 1
    response = HttpResponse(mimetype="application/ms-excel")
    response['Content-Disposition'] = 'attachment; filename=%s.xls' % name
    xls.save(response)
    return response

def csv_response(parcels, name):
    csv = "APN,OWNER,MAILING_1,MAILING_2, SITUS_1,SITUS_2\n"
    for parcel in parcels:
        csv += "%s," % parcel.apn
        csv += "%s," % parcel.owner
        csv += "%s," % parcel.mail1
        csv += "%s," % parcel.mail2
        csv += "%s," % parcel.situs1
        csv += "%s\n" % parcel.situs2
    response = HttpResponse(csv, mimetype="text/csv")
    response['Content-Disposition'] = 'attachment; filename=%s.csv' % name
    return response

def pdf_response(parcels, name, apn=False, address='mail', unique=False, format='Avery-5160'):
    pdf = PDFLabel(format)
    pdf.add_page()
    results = []
    if unique:
        keys = []
        for parcel in parcels:
            key = "%s%s" % (parcel.owner,parcel.mail1)
            if not key in keys:
                results.append(parcel)
                keys.append(key)
    else:
        results = parcels
    for parcel in results:
        if apn:
            apntxt = '%s' % (parcel.apn or '')
        else:
            apntxt = ''
        ownertxt = '%s' % (parcel.owner or '')
        if address == 'mail' or address == 'both':
            txt = '%s\n%s' % (parcel.mail1 or '', parcel.mail2 or '')
            pdf.add_label('%s\n%s\n%s' % (apntxt, ownertxt, txt))
        if address == 'situs' or address == 'both':
            if address == 'both' and parcel.mail1 == parcel.situs1:
                continue
            txt = '%s\n%s' % (parcel.situs1 or '', parcel.situs2 or '')
            pdf.add_label('%s\n%s\n%s' % (apntxt, ownertxt, txt))
    response = HttpResponse(mimetype='application/pdf')
    # remove this header if you want the pdfs to open in the browser
    #response['Content-Disposition'] = 'attachment;filename=%s.pdf' % name
    response.write(pdf.output('','S'))
    return response
