import * as Express from 'express';
import * as path from 'path';

import 'elmegram.js';

startServer(Express())

async function startServer(app: Express) {
  // Static website
  app.use(Express.static(path.join(__dirname, '/public/')))

  const listener = app.listen(process.env.PORT, function () {
    console.log('Your app is listening on port ' + listener.address().port)
  })

  await import('./startBot.js');
}
