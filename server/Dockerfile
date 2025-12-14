# 使用 Node.js 20 Alpine 镜像（更小的体积）
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖（包括 devDependencies，因为需要 TypeScript 编译）
RUN npm ci

# 复制源代码
COPY . .

# 构建 TypeScript
RUN npm run build

# 删除 devDependencies 以减小镜像大小
RUN npm prune --production

# 暴露端口（Cloud Run 使用 PORT 环境变量）
EXPOSE 8080

# 设置环境变量
ENV PORT=8080
ENV NODE_ENV=production

# 启动应用
CMD ["node", "dist/index.js"]

