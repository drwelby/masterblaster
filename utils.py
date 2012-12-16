from django.http import HttpResponse
from pdflabels import PDFLabel
import xlwt

def xls_response(parcels, name):
    xls = xlwt.Workbook()
    ws = xls.add_sheet('Notification')
    for c, txt in enumerate(('APN', 'OWNER', 'MAIL1', 'MAIL2', 'SITUS1', 'SITUS2')):
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

def pdf_response(parcels, name, apn=False, address='mailing', format='Avery-5160'):
    pdf = PDFLabel(format)
    pdf.add_page()
    for parcel in parcels:
        txt = '' 
        if apn:
            txt += '%s\n' % (parcel.apn or '')
        txt += '%s\n' % (parcel.owner or '')
        if address == 'mailing':
            txt += '%s\n%s\n' % (parcel.mail1 or '', parcel.mail2 or '')
        else:
            txt += '%s\n%s\n' % (parcel.situs1 or '', parcel.situs2 or '')
        pdf.add_label(txt)
    response = HttpResponse(mimetype='application/pdf')
    # remove this header if you want the pdfs to open in the browser
    #response['Content-Disposition'] = 'attachment;filename=%s.pdf' % name
    response.write(pdf.output('','S'))
    return response
