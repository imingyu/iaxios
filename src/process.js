class Process {
    constructor() {
        this.stack = [];
    }

    use(handler) {
        if (typeof handler !== 'function') return;
        this.stack.push(handler);
    }

    next() {
        var item = this.stack.pop();
        if (item) {
            item(this.next);
        }
    }
}