import type { CheckoutResponse } from "@/types/api"

const WOMPI_WIDGET_SRC = "https://checkout.wompi.co/widget.js"

export interface WompiTransaction {
  id: string
  status: string
  reference: string
  amount_in_cents: number
  currency: string
  [key: string]: unknown
}

interface WompiCheckoutConfig {
  currency: string
  amountInCents: number
  reference: string
  publicKey: string
  signature: { integrity: string }
  redirectUrl?: string
}

interface WompiCheckoutInstance {
  open: (callback: (result: { transaction: WompiTransaction }) => void) => void
}

declare global {
  interface Window {
    WidgetCheckout?: new (config: WompiCheckoutConfig) => WompiCheckoutInstance
  }
}

let scriptPromise: Promise<void> | null = null

export function loadWompiWidget(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Wompi solo está disponible en el navegador"))
  }
  if (window.WidgetCheckout) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${WOMPI_WIDGET_SRC}"]`,
    )
    if (existing) {
      existing.addEventListener("load", () => resolve())
      existing.addEventListener("error", () =>
        reject(new Error("No se pudo cargar el widget de Wompi")),
      )
      return
    }
    const script = document.createElement("script")
    script.src = WOMPI_WIDGET_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null
      reject(new Error("No se pudo cargar el widget de Wompi"))
    }
    document.head.appendChild(script)
  })

  return scriptPromise
}

export async function openWompiCheckout(
  checkout: CheckoutResponse,
): Promise<WompiTransaction> {
  await loadWompiWidget()
  if (!window.WidgetCheckout) {
    throw new Error("El widget de Wompi no está disponible")
  }

  const instance = new window.WidgetCheckout({
    currency: checkout.currency,
    amountInCents: checkout.amount_in_cents,
    reference: checkout.reference,
    publicKey: checkout.public_key,
    signature: { integrity: checkout.signature_integrity },
    redirectUrl: checkout.redirect_url,
  })

  return new Promise<WompiTransaction>((resolve) => {
    instance.open((result) => resolve(result.transaction))
  })
}
