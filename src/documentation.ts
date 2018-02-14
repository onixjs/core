import * as serveStatic from 'serve-static';
///Volumes/BACKUP/development/@mean-expert/Onix
import * as finalhandler from 'finalhandler';
import * as http from 'http';
import * as path from 'path';

const serve = serveStatic(path.join(process.cwd(), 'documentation'), {
  index: ['index.html'],
});

// Create server
const server = http.createServer(function onRequest(req, res) {
  serve(req, res, finalhandler(req, res));
});

// Listen
server.listen(3000);
