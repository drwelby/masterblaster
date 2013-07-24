masterblaster = {};

masterblaster.tools = {
    available: {},
    add: function(tool) {
        this.available[tool.name] = tool;
        $(tool.toggleId).click($.proxy(tool.toggle, tool));
    },
    setActive: function(name) {
        if (this.clickFn) {
            map.off('click',this.clickFn, this.activeTool);
        }
        if (this.dblclickFn) {
            map.off('dblclick',this.dblclickFn, this.activeTool);
        }
        if (this.mousemoveFn) {
            map.off('mousemove',this.mousemoveFn, this.activeTool);
        }
        this.activeTool = this.available[name];
        this.clickFn = this.activeTool.click;
        map.on('click',this.clickFn, this.activeTool);
        this.dblclickFn = this.activeTool.dblclick;
        map.on('dblclick',this.dblclickFn, this.activeTool);
        if (this.activeTool.mousemove) {
            this.mousemoveFn = this.activeTool.mousemove;
            map.on('mousemove', this.mousemoveFn, this.activeTool);
        }else{
            this.mousemoveFn = null;
        }
    },
    setNone : function() {
        map.off('click',this.clickFn, this.activeTool);
        map.off('dblclick',this.dblclickFn, this.activeTool);
        this.activeTool = undefined;
    },
    resetAll: function() {
        for (name in this.available) {
            tool = this.available[name];
            tool.deactivate();
        }
    },
    resetActive: function() {
        if (this.activeTool) {
            this.activeTool.deactivate();
        }
    },
    sendAction :function(data,callback) {
        $.ajax({
            type: "POST",
            url: "/" + data.action + "/",
            // The key needs to match your method's input parameter (case-sensitive).
            data: JSON.stringify({ data: data }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            statusCode: {
                200: function(data, textStatus, jqXHR) {callback(data)},
                304: function(data, textStatus, jqXHR) {console.log('304')},
                404: function() {alert('Server Error')}
            }
        });
    }
}

masterblaster.Tool=L.Class.extend( {
    name: 'basetool',
    activated: false,
    toggleId: "#faketool",
    _map: map,
    click: function() {
        console.log('click');
    },
    dblclick: function() {
        console.log ('dblclick');
    },
    mousemove: function() {
        console.log('mousemove')
    },
    activate: function() {
        console.log('activate')
    },
    deactivate: function() {
        console.log('deactivate')
    },
    activateButtons: function() {
        masterblaster.tools.resetActive();
        this.activated = true;
        $(this.toggleId).addClass('btn-primary');
        masterblaster.tools.setActive(this.name);
    },
    deactivateButtons: function() {
        this.activated = false;
        $(this.toggleId).removeClass('btn-primary');
        masterblaster.tools.setNone();
    },
    toggle: function() {
        this.activated = !this.activated;
        if (this.activated) {
            console.log('activated');
            this.activate();
        }else{
            console.log('deactivated');
            this.deactivate();
        }
    }
});

masterblaster.tool = function (options) {
        return new masterblaster.Tool(options);
};
