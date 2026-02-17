export const STATUS_CODE = {
  NOTFOUND: 404,
  UNAUTHOURIZED: 401,
  FORBIDDEN: 403,
  CREATED: 201,
  SUCCESS: 200,
  SERVER_ERROR: 500,
  BAD_REQUEST: 400,
};

export class BaseError extends Error {
  status = 500;
  constructor(message, options) {
    super(message, options);
    this.status = options.status;
  }
}

export function NotFoundError(message, options = {}) {
  return new BaseError(message, {
    ...options,
    status: STATUS_CODE.NOTFOUND,
  });
}
export function UnauthourizedError(message, options = {}) {
  return new BaseError(message, {
    ...options,
    status: STATUS_CODE.UNAUTHOURIZED,
  });
}
export function UnAuthenticatedError(message, options = {}) {
  return new BaseError(message, {
    ...options,
    status: STATUS_CODE.FORBIDDEN,
  });
}
export function BadRequestError(message, options = {}) {
  return new BaseError(message, {
    ...options,
    status: STATUS_CODE.BAD_REQUEST,
  });
}
