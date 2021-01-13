function requireBasicAuth(req, res, next) {
  console.log(req.get('authorization'));
  let basicToken;

  const authToken = req.get('authorization') || '';
  if (!authToken.toLowerCase().startsWith('basic ')) {
    return res.status(401).json({ error: { message: 'Missing Basic token' } });
  } else {
    basicToken = authToken.slice('basic '.length, authToken.length);
  }

  const [tokenUsername, tokenPassword] = Buffer.from(basicToken, 'base64')
    .toString()
    .split(':');

  console.log(tokenUsername, tokenPassword);

  if (!tokenPassword || !tokenUsername) {
    return res.status(401).json({ error: { message: 'Unauthorized request' } });
  }

  req.app
    .get('db')('thingful_users')
    .where({ user_name: tokenUsername })
    .first()
    .then((user) => {
      if (!user || user.password !== tokenPassword) {
        return res
          .status(401)
          .json({ error: { message: 'Unauthorized request' } });
      }
      req.user = user;
      next();
    })
    .catch(next);
}

module.exports = { requireBasicAuth };
