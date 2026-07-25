/**
 * Vendor product form validation.
 *
 * "Compare at price" had a `.positive()` rule but no message anywhere in the
 * markup, so an invalid value silently blocked submit — which read as the
 * field being required. These tests pin the message to the field.
 *
 * Submission goes through fireEvent.submit rather than clicking the button:
 * jsdom does not implement requestSubmit, so a click on a submit button never
 * reaches the form's onSubmit.
 */
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductForm } from "@/components/vendor/product-form";

const createMutate = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), refresh: jest.fn() }),
}));

jest.mock("@/hooks/useCategories", () => ({
  useCategories: () => ({
    data: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "Vintage",
        slug: "vintage",
      },
    ],
  }),
}));

jest.mock("@/hooks/useProducts", () => ({
  useCreateProduct: () => ({ mutateAsync: createMutate, isPending: false }),
  useUpdateProduct: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

jest.mock("@/lib/api/media", () => ({
  mediaApi: { uploadMultiple: jest.fn(), delete: jest.fn() },
}));

const COMPARE_PRICE_ERROR = /compare price must be greater than 0/i;

function renderForm() {
  const { container } = render(<ProductForm mode="create" />);
  return {
    submit: () => fireEvent.submit(container.querySelector("form")!),
  };
}

describe("ProductForm validation", () => {
  beforeEach(() => {
    createMutate.mockClear();
  });

  it("explains an invalid compare-at price instead of silently refusing", async () => {
    const user = userEvent.setup();
    const { submit } = renderForm();

    await user.type(screen.getByLabelText(/compare at price/i), "-5");
    submit();

    await waitFor(() =>
      expect(screen.getByText(COMPARE_PRICE_ERROR)).toBeInTheDocument()
    );
    expect(createMutate).not.toHaveBeenCalled();
  });

  it("treats an empty compare-at price as omitted, not invalid", async () => {
    const { submit } = renderForm();

    submit();

    // The other required fields are empty, so their messages appear — but the
    // optional compare-at price must not be one of them.
    await waitFor(() =>
      expect(screen.getByText(/title must be at least/i)).toBeInTheDocument()
    );
    expect(screen.queryByText(COMPARE_PRICE_ERROR)).not.toBeInTheDocument();
  });

  it("reports every invalid field at once", async () => {
    const { submit } = renderForm();

    submit();

    await waitFor(() =>
      expect(screen.getAllByRole("alert").length).toBeGreaterThan(1)
    );
    expect(
      screen.getAllByRole("alert").map((el) => el.textContent)
    ).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/title must be at least/i),
        expect.stringMatching(/description must be at least/i),
        expect.stringMatching(/please select a valid category/i),
      ])
    );
  });
});
