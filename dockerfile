# Usamos la imagen oficial de Nginx en su versión ligera (alpine)
FROM nginx:alpine

# Copiamos todos los archivos del directorio actual a la carpeta pública de Nginx
COPY . /usr/share/nginx/html

# Exponemos el puerto 80 (el puerto por defecto del servidor web)
EXPOSE 80

# Comando para mantener Nginx corriendo en primer plano
CMD ["nginx", "-g", "daemon off;"]