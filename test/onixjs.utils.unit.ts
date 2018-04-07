import {test} from 'ava';
import {AsyncWalk} from '../src';

//Test Utils Directory Async Walk
test('Core: utils walk.', async t => {
  const files: string[] = <string[]>await AsyncWalk(__dirname);
  const found: string[] = files.filter((file: string) => file === __filename);
  t.is(found.length, 1);
});
