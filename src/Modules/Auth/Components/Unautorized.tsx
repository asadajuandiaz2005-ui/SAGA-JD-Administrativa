import { Link } from '@tanstack/react-router'

const Unauthorized = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-red-50">
            <div className="flex flex-col items-center max-w-2xl px-8 py-10">
                {/* Imagen ilustrativa */}
                <div className="mb-8">
                    <img 
                        src="https://img.freepik.com/free-vector/401-error-unauthorized-concept-illustration_114360-1934.jpg" 
                        alt="401 Unauthorized" 
                        className="w-80 h-80 object-contain"
                    />
                </div>
                
                {/* Contenido */}
                <div className="flex flex-col items-center bg-white rounded-xl shadow-lg px-8 py-8 w-full">
                    <h1 className="text-gray-800 text-5xl font-extrabold mb-3">¡Alto!</h1>
                    <h2 className="text-red-600 text-2xl font-bold mb-4">Acceso no autorizado</h2>
                    <p className="text-lg text-gray-600 mb-6 text-center max-w-md leading-relaxed">
                        No tienes permiso para acceder a esta página.
                        Si crees que es un error, contacta al administrador.
                    </p>
                    <Link
                        to="/Home"
                        className="mt-2 px-8 py-3 text-base bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-200 font-semibold"
                    >
                        Volver al inicio
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default Unauthorized;