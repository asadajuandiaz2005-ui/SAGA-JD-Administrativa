import { Link } from '@tanstack/react-router';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="flex flex-col items-center max-w-2xl px-8 py-10">
        {/* Imagen ilustrativa */}
        <div className="mb-8">
          <img 
            src="https://img.freepik.com/free-vector/oops-404-error-with-broken-robot-concept-illustration_114360-5529.jpg" 
            alt="404 Not Found" 
            className="w-80 h-80 object-contain"
          />
        </div>
        
        {/* Contenido */}
        <div className="flex flex-col items-center bg-white rounded-xl shadow-lg px-8 py-8 w-full">
          <h1 className="text-gray-800 text-5xl font-extrabold mb-3">¡Oops!</h1>
          <h2 className="text-blue-600 text-2xl font-bold mb-4">Página no encontrada</h2>
          <p className="text-lg text-gray-600 mb-6 text-center max-w-md leading-relaxed">
            La página que buscas no existe o ha sido movida.
            Verifica la URL o regresa al inicio.
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
  );
};

export default NotFound;