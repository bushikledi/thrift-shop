import { mapOrderItemProduct, mapOrderItems } from './order-response.mapper';

describe('order-response.mapper', () => {
  describe('mapOrderItemProduct', () => {
    it('maps a joined product to the documented shape', () => {
      const result = mapOrderItemProduct({
        productId: 'p1',
        title: 'Snapshot Title',
        product: {
          id: 'p1',
          title: 'Live Product Title',
          slug: 'live-product',
          media: [{ url: 'a.jpg' }, { url: 'b.jpg' }],
        },
      });

      expect(result).toEqual({
        id: 'p1',
        // Prefers the immutable order-time snapshot over the live title.
        name: 'Snapshot Title',
        slug: 'live-product',
        images: ['a.jpg', 'b.jpg'],
      });
    });

    it('falls back to the live product title when no snapshot exists', () => {
      const result = mapOrderItemProduct({
        productId: 'p1',
        title: null,
        product: { id: 'p1', title: 'Live Title', slug: 's', media: [] },
      });

      expect(result.name).toBe('Live Title');
      expect(result.images).toEqual([]);
    });

    it('handles a missing product relation (list queries)', () => {
      const result = mapOrderItemProduct({
        productId: 'p1',
        title: 'Order-time Name',
      });

      expect(result).toEqual({
        id: 'p1',
        name: 'Order-time Name',
        slug: '',
        images: [],
      });
    });

    it('never returns an empty name', () => {
      const result = mapOrderItemProduct({ productId: 'p1' });
      expect(result.name).toBe('Product');
    });
  });

  describe('mapOrderItems', () => {
    it('normalizes every item while preserving other order fields', () => {
      const order = {
        id: 'o1',
        total: 100,
        items: [
          { productId: 'p1', title: 'One', product: null },
          {
            productId: 'p2',
            title: 'Two',
            product: { id: 'p2', title: 'Two Live', slug: 'two', media: [] },
          },
        ],
      };

      const result = mapOrderItems(order);

      expect(result.id).toBe('o1');
      expect(result.total).toBe(100);
      expect(result.items[0].product).toEqual({
        id: 'p1',
        name: 'One',
        slug: '',
        images: [],
      });
      expect(result.items[1].product.slug).toBe('two');
    });
  });
});
