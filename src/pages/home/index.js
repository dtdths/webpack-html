import '@/public/aaa';
import '@/public/bbb';
import '@babel/polyfill';
import $ from 'jquery';
import './index.scss';

console.log(1);
console.log($);

async function a() {
  console.log('begin');
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 1000);
  });
  console.log('done');
}
a();

console.log(Object.values({ 1: 2 }));

console.log(Array.isArray([]));
