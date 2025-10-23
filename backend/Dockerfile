# Define a imagem base do Node.js (versão 20, leve e segura)
FROM node:20-alpine

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de dependências para aproveitar o cache do Docker
COPY package*.json ./

# Instala as dependências do projeto
RUN npm install

# Copia o restante do código da aplicação para o container
COPY . .

# Expõe a porta que a aplicação usará
EXPOSE 3333

# Comando para iniciar a aplicação ao executar o container
CMD [ "npm", "start" ]
