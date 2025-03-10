import { setup } from './setup.js';
import { stress } from './stress.js';
import { DB } from './DB.js';

(async() => {

    await setup();

    const db = new DB();
    await db.load();

    for (let i = 0; i < 100; i++) {
        await stress(db, 1000, 1000);
    }

    console.log('Done');
})();