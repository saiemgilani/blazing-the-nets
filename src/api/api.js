import fetch from 'isomorphic-fetch';
import transformResults from './transformResults';

const publicRoot = process.env.PUBLIC_URL;

export function getAllData() {
  return fetch(`${publicRoot}/data/data.json`)
    .then(response => response.json())
    .then(transformResults);
}
