import jwt from 'jsonwebtoken';
var secretKey = "9sd7fhu2e79abda9732b";

export const extractToken = (req) => {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
        return req.query.token;
    }
    return null;
}

export const validateReq = (req, pathname, protectedEndPoints) => {
    req.token = extractToken(req);
    let requestIsValid = true;
    let patterns = protectedEndPoints.map(
        protectedEndPoint => {
            if(protectedEndPoint.endsWith("/*"))
                return protectedEndPoint.replace('/*', "\/{0,}\.{0,}")
            return protectedEndPoint
        }
    )
    let filtered = patterns.filter(pattern => pathname.match(new RegExp(pattern, 'gm'))?.length > 0)
    if(filtered?.length==0)
        return true;
    jwt.verify(req.token, secretKey, (err, authData) => {
        if (err) {
            requestIsValid = false;
        } else {
            requestIsValid = true;
        }
    });
    return requestIsValid;
}

export const getBody = (req, buffers) => {
    if(req.headers['content-type']=='application/json')
        return JSON.parse(Buffer.concat(buffers).toString())
    return Buffer.concat(buffers).toString()
}