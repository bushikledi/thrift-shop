/**
 * ProductCard Component Tests
 */
import { render, screen, fireEvent } from "../test-utils";
import { ProductCard } from "@/components/products/product-card";
import { testData } from "../test-utils";

describe("ProductCard", () => {
  const mockProduct = testData.product();

  it("renders product information correctly", () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
    expect(
      screen.getByText(`$${mockProduct.price.toFixed(2)}`)
    ).toBeInTheDocument();
    expect(
      screen.getByText(mockProduct.vendor.businessName)
    ).toBeInTheDocument();
  });

  it("displays product image when available", () => {
    render(<ProductCard product={mockProduct} />);

    const image = screen.getByRole("img", { name: mockProduct.name });
    expect(image).toHaveAttribute("src", expect.stringContaining("image.jpg"));
  });

  it("shows placeholder when no image", () => {
    const productWithoutImage = testData.product({ images: [] });
    render(<ProductCard product={productWithoutImage} />);

    // Should show package icon placeholder
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("displays condition badge", () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText(/good/i)).toBeInTheDocument();
  });

  it("shows original price when discounted", () => {
    const discountedProduct = testData.product({
      price: 19.99,
      originalPrice: 29.99,
    });
    render(<ProductCard product={discountedProduct} />);

    expect(screen.getByText("$19.99")).toBeInTheDocument();
    expect(screen.getByText("$29.99")).toBeInTheDocument();
  });

  it("links to product detail page", () => {
    render(<ProductCard product={mockProduct} />);

    const link = screen.getByRole("link", { name: mockProduct.name });
    expect(link).toHaveAttribute("href", `/products/${mockProduct.slug}`);
  });

  it("handles add to cart click", async () => {
    const onAddToCart = jest.fn();
    render(<ProductCard product={mockProduct} onAddToCart={onAddToCart} />);

    const addToCartButton = screen.getByRole("button", {
      name: /add to cart/i,
    });
    fireEvent.click(addToCartButton);

    expect(onAddToCart).toHaveBeenCalledWith(mockProduct.id);
  });

  it("handles wishlist toggle", async () => {
    const onToggleWishlist = jest.fn();
    render(
      <ProductCard product={mockProduct} onToggleWishlist={onToggleWishlist} />
    );

    const wishlistButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(wishlistButton);

    expect(onToggleWishlist).toHaveBeenCalledWith(mockProduct.id);
  });

  it("shows out of stock indicator", () => {
    const outOfStockProduct = testData.product({
      stock: 0,
      isActive: false,
    });
    render(<ProductCard product={outOfStockProduct} />);

    expect(screen.getByText(/out of stock/i)).toBeInTheDocument();
  });

  it("applies hover effects", () => {
    const { container } = render(<ProductCard product={mockProduct} />);

    const card = container.querySelector("[data-card]");
    expect(card).toHaveClass("group");
  });
});
