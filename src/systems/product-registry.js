class ProductRegistry {
    constructor() {
        this.products = new Map();
    }
    
    upsert(product) {
        this.products.set(product.id, product);
    }
    
    get(id) {
        return this.products.get(id);
    }
    
    all() {
        return Array.from(this.products.values());
    }
}

const productRegistry = new ProductRegistry();
