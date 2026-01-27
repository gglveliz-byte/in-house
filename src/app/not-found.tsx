import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border-2 border-gray-100 rounded-2xl p-8 text-center shadow-lg">
        {/* Ilustración 404 */}
        <div className="relative mb-6">
          <div className="text-8xl font-bold text-gray-200">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl">🔍</span>
          </div>
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold text-gray-800 mb-3">
          Página no encontrada
        </h1>

        {/* Mensaje */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          La página que buscas no existe o fue movida a otra ubicación.
          Puede que el enlace esté incorrecto.
        </p>

        {/* Sugerencias */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
          <p className="text-sm font-medium text-gray-700 mb-2">Prueba con:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li className="flex items-center gap-2">
              <span className="text-green-500">•</span>
              Verificar la dirección URL
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">•</span>
              Volver a la página de inicio
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">•</span>
              Buscar el contenido desde el menú
            </li>
          </ul>
        </div>

        {/* Botón */}
        <Link
          href="/"
          className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md"
        >
          Volver al inicio
        </Link>

        {/* Mensaje adicional */}
        <p className="mt-6 text-sm text-gray-400">
          Si crees que esto es un error, regresa más tarde.
        </p>
      </div>
    </div>
  )
}
