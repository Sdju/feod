export interface CartItem {
  id: number
  title: string
  price: number
  quantity: number
  image: string
}

export type CartProduct = Omit<CartItem, 'quantity'>
