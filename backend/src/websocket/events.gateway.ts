import {
    WebSocketGateway,
    WebSocketServer,
  } from '@nestjs/websockets';
  import { Server } from 'socket.io';
  import { createClient } from 'redis';
  import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
  
  @WebSocketGateway({
    cors: { origin: '*' },
    namespace: '/notifications',
  })
  export class EventsGateway implements OnModuleInit, OnModuleDestroy {
    @WebSocketServer()
    server: Server;
  
    private redisSub = createClient({ url: 'redis://localhost:6379' });
  
    async onModuleInit() {
      await this.redisSub.connect();
      await this.redisSub.subscribe('todo_updated', (message) => {
        this.server.emit('todo_updated', JSON.parse(message));
      });
    }
  
    async onModuleDestroy() {
      await this.redisSub.quit();
    }
  }
  