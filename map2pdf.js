var page = require('webpage').create(),
    system = require('system');

if (system.args.length != 4) {
    console.log('usage: map2pdf.js hostname payload outputfile');
}

address = system.args[1];
payload = system.args[2];
tempfile = system.args[3];

page.viewportSize = { width: 1000, height: 800 }; 
page.paperSize = {format: "Letter", orientation: "landscape", margin: '0.25in'};
//page.zoomFactor = 0.5;

page.open(address, 'post', payload, function (status) {
    if (status !== 'success') {
        console.log('Unable to post!');
    } else {
            page.render(tempfile)
    }
    phantom.exit();
});
