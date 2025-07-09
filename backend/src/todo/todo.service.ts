import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Todo } from './entities/todo.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { createClient } from 'redis';
import { CreateTodoDto } from './dto/create-todo.dto';

@Injectable()
export class TodoService {
  private redisPub = createClient({ url: 'redis://localhost:6379' });

  constructor(
    @InjectRepository(Todo)
    private todoRepository: Repository<Todo>,
  ) {
    this.redisPub.connect().then(() => {
      console.log('🔌 Conectado a Redis para publicar eventos TODO');
    });
  }

  async findAll(): Promise<Todo[]> {
    return this.todoRepository.find();
  }

  async create(createTodoDto: CreateTodoDto): Promise<Todo> {
    const todo = this.todoRepository.create(createTodoDto);
    const saved = await this.todoRepository.save(todo);
    await this.redisPub.publish('todo_updated', JSON.stringify({ action: 'create', todo: saved }));
    return saved;
  }

  async update(id: number, updateDto: Partial<CreateTodoDto>): Promise<Todo> {
    await this.todoRepository.update(id, updateDto);
    const updated = await this.todoRepository.findOneBy({ id });
    if (updated) {
      await this.redisPub.publish('todo_updated', JSON.stringify({ action: 'update', todo: updated }));
    }
    if (!updated) {
      throw new Error('Todo not found');
    }
    return updated;
  }

  async remove(id: number): Promise<void> {
    await this.todoRepository.delete(id);
    await this.redisPub.publish('todo_updated', JSON.stringify({ action: 'delete', todoId: id }));
  }
}
