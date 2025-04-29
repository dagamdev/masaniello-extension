function handleCanvas () {
  if (['olymptrade.com'].includes(host)) {
    const canvas = document.querySelector('canvas')
    console.log(canvas)
    if (!canvas) {
      setTimeout(() => {
        handleCanvas()
      }, 250)
      return
    }
    
    setTimeout(async () => {
      console.log('Canvas listo')
      console.log(canvas.toDataURL())
      
      if (window.Tesseract) {
        const result = await Tesseract.recognize(canvas, 'eng', {
          logger: m => console.log(m)
        })

        const text = result.data.text.trim()
        if (text) {
          console.log('📖 Texto detectado en el canvas:', text)
        } else {
          console.log('🔍 No se detectó texto en esta imagen del canvas.')
        }
      } else {
        console.warn('Tesseract no está cargado todavía.')
      }
    }, 500)
    // ctx.fillText = function(text, x, y, ...rest) {
    //   console.log('Texto dibujado en canvas:', text, 'en posición', x, y)
    //   // Aquí puedes buscar si el texto es una ganancia/pérdida tipo +$4.50 o -$3.00
    //   if (typeof text === 'string' && /[\+\-]?\$?\d+(\.\d+)?/.test(text)) {
    //     console.log('⚡ Posible monto detectado:', text)
    //   }
    //   return originalFillText.apply(this, arguments)
    // }
  }
}