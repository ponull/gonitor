export const ExecuteTypeEnum = {
    HTTP : 'http',
    CMD : 'cmd',
    FILE : 'file',
    getLanguage : function(type){
        switch(type){
            case this.HTTP:
                return 'HTTP';
            case this.CMD:
                return 'CMD';
            case this.FILE:
                return 'FILE';
            default:
                return 'UNKNOWN';
        }
    },
    getCommandLabel: function (type) {
        switch (type) {
            case this.HTTP:
                return 'Http Url (only support GET method)';
            case this.CMD:
                return 'Bash Command';
            case this.FILE:
                return 'File Path (Fullpath)';
            default:
                return 'This type not support';
        }
    }
}

export const StrategyEnum = {
    PARALLEL : 0,
    SKIP : 1,
    DELAY : 2,
    getLanguage : function(type){
        switch(type){
            case this.PARALLEL:
                return 'Parallel';
            case this.SKIP:
                return 'Skip';
            case this.DELAY:
                return 'Delay';
            default:
                return 'UNKNOWN';
        }
    }
}