export type ErrorHandlerCallback = (err: any, context: any, methodName: string, args: any[]) => void;
const defaultErrorHandler = (err: any, ctx: any, name: string, args: any[]) => {
        console.error(`Ошибка в ${name}:`, err);
    }

export function catchErrors(
    handler: ErrorHandlerCallback = defaultErrorHandler
  ): MethodDecorator {

    return function (target, propertyKey, descriptor: PropertyDescriptor) {
        const original = descriptor.value;
        descriptor.value = async function (...args: any[]) {
            try {
                const result = original.apply(this, args);
                if (result instanceof Promise) {
                    return await result;
                }
                return result;
            } catch (err) {
                handler.call(this, err, this, propertyKey as string, args);
            }
        };
        return descriptor;
    };
}
