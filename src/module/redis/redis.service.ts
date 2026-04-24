import {Injectable } from "@nestjs/common";
import Redis from 'ioredis';


@Injectable()
export class RedisService {
 private client : Redis;

 constructor() {
  this.client = new Redis({
    host: 'localhost',
    port: 6379,
  });
 }

 async setLock(key : string, value : string, ttl : number){
    return this.client.set(key , value, 'EX', ttl)
 }

 async getLock(key : string){
    return this.client.get(key)
 }

 async deleteLock(key : string){
    return this.client.del(key)
 }
}
