export default class Process {
    constructor() {
        this.stack = [];
        this.iaxios = null;
        this.requestName = '';
        this.requestArgs = null;
        this.isCancel = false;
        this.dataMap = [];
        this.cancelToken = null;
    }

    use(handler) {
        if (typeof handler !== 'function') return;
        this.stack.push(handler);
    }

    next() {
        var item = this.stack.shift();
        if (item) {
            item(this.next.bind(this));
        }
    }
}