/**
 * Cart store tests.
 *
 * setCartFromApi maps the API cart into the store's flat shape. These cases
 * cover the details that were previously untyped and easy to get wrong: string
 * prices from the Decimal column, and a product with no flat vendorId.
 */
import { useCartStore } from "@/lib/stores/cart-store";

function resetStore() {
  useCartStore.setState({ items: [] });
}

const apiCart = {
  items: [
    {
      productId: "p1",
      quantity: 2,
      product: {
        title: "Vintage Jacket",
        price: "45.00", // Decimal columns serialise as strings
        vendorId: "v1",
        media: [{ url: "https://cdn.example/jacket.jpg" }],
      },
    },
  ],
};

describe("cart store - setCartFromApi", () => {
  beforeEach(resetStore);

  it("maps an API cart into store items", () => {
    useCartStore.getState().setCartFromApi(apiCart);

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      productId: "p1",
      name: "Vintage Jacket",
      quantity: 2,
      vendorId: "v1",
      image: "https://cdn.example/jacket.jpg",
    });
  });

  it("parses a string price into a number", () => {
    useCartStore.getState().setCartFromApi(apiCart);
    expect(useCartStore.getState().items[0].price).toBe(45);
  });

  it("computes totals from the mapped items", () => {
    useCartStore.getState().setCartFromApi(apiCart);
    // 45.00 * 2
    expect(useCartStore.getState().totalPrice()).toBe(90);
    expect(useCartStore.getState().itemCount()).toBe(2);
  });

  it("falls back to an empty string when the product has no vendorId", () => {
    useCartStore.getState().setCartFromApi({
      items: [
        {
          productId: "p2",
          quantity: 1,
          product: { title: "No Vendor", price: 10 },
        },
      ],
    });
    expect(useCartStore.getState().items[0].vendorId).toBe("");
  });

  it("clears the cart for a null or empty payload", () => {
    useCartStore.getState().setCartFromApi(apiCart);
    useCartStore.getState().setCartFromApi(null);
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});
