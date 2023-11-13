import { Injectable } from '@nestjs/common';
import axios, { AxiosHeaders, AxiosRequestConfig, Method } from 'axios';
import { encodeGetParams } from '../../common/src';

@Injectable()
export class AxiosService {
  async request(
    url: string,
    method: Method,
    data: any = {},
    headers: any = {},
  ) {
    const requestConfig: AxiosRequestConfig = {
      method,
      headers,
    };
    if (method === 'GET') {
      url += encodeGetParams(data);
    } else {
      requestConfig.data = data;
    }
    requestConfig.url = url;
    return await axios(requestConfig);
  }
}
