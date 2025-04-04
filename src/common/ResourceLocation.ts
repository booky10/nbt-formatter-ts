import StringReader from "./StringReader.js";
import {assert, SHORT_MAX_VALUE} from "./util.js";

export const NAMESPACE_SEPARATOR = ":";
export const DEFAULT_NAMESPACE = "minecraft";
const MAX_BYTES_PER_CHAR_UTF8 = 3;

export default class ResourceLocation {
  private readonly namespace: string;
  private readonly path: string;

  constructor(namespace: string, path: string) {
    assert(ResourceLocation.isValidNamespace(namespace));
    assert(ResourceLocation.isValidPath(namespace));

    // Paper start - Validate ResourceLocation
    // Check for the max network string length (capped at Short.MAX_VALUE) as well as the max bytes of a StringTag (length written as an unsigned short)
    const resourceLocation = `${namespace}:${path}`;
    if (resourceLocation.length > SHORT_MAX_VALUE || resourceLocation.length * MAX_BYTES_PER_CHAR_UTF8 > 2 * SHORT_MAX_VALUE + 1) {
      throw new Error(`Resource location too long: ${resourceLocation}`);
    }
    // Paper end - Validate ResourceLocation

    this.namespace = namespace;
    this.path = path;
  }

  static createUntrusted(namespace: string, path: string): ResourceLocation {
    return new ResourceLocation(
        ResourceLocation.assertValidNamespace(namespace, path),
        ResourceLocation.assertValidPath(namespace, path));
  };

  static fromNamespaceAndPath(namespace: string, path: string) {
    return ResourceLocation.createUntrusted(namespace, path);
  };

  static parse(string: string) {
    return ResourceLocation.bySeparator(string, NAMESPACE_SEPARATOR);
  };

  static withDefaultNamespace(path: string) {
    return new ResourceLocation(DEFAULT_NAMESPACE, ResourceLocation.assertValidPath(DEFAULT_NAMESPACE, path));
  };

  static tryParse(string: string) {
    return ResourceLocation.tryBySeparator(string, NAMESPACE_SEPARATOR);
  };

  static tryBuild(namespace: string, path: string) {
    if (ResourceLocation.isValidNamespace(namespace) && ResourceLocation.isValidPath(path)) {
      return new ResourceLocation(namespace, path);
    }
    return undefined;
  };

  static bySeparator(string: string, separator: string) {
    const separatorIndex = string.indexOf(separator);
    if (separatorIndex >= 0) {
      const path = string.substring(separatorIndex + 1);
      if (separatorIndex !== 0) {
        const namespace = string.substring(0, separatorIndex);
        return ResourceLocation.createUntrusted(namespace, path);
      } else {
        return ResourceLocation.withDefaultNamespace(path);
      }
    } else {
      return ResourceLocation.withDefaultNamespace(string);
    }
  };

  static tryBySeparator(string: string, separator: string) {
    const separatorIndex = string.indexOf(separator);
    if (separatorIndex >= 0) {
      const path = string.substring(separatorIndex + 1);
      if (!ResourceLocation.isValidPath(path)) {
        return undefined;
      } else if (separatorIndex !== 0) {
        const namespace = string.substring(0, separatorIndex);
        return ResourceLocation.isValidNamespace(namespace) ? new ResourceLocation(namespace, path) : undefined;
      } else {
        return new ResourceLocation(DEFAULT_NAMESPACE, path);
      }
    } else {
      return ResourceLocation.isValidPath(string) ? new ResourceLocation(DEFAULT_NAMESPACE, string) : undefined;
    }
  };

  public getPath() {
    return this.path;
  }

  public getNamespace() {
    return this.namespace;
  }

  public toString() {
    return `${this.namespace}:${this.path}`;
  }

  static readGreedy(reader: StringReader) {
    const cursor = reader.getCursor();
    while (reader.canRead() && ResourceLocation.isAllowedInResourceLocation(reader.peek())) {
      reader.skip();
    }
    return reader.getString().substring(cursor, reader.getCursor());
  };

  static read(reader: StringReader) {
    const cursor = reader.getCursor();
    const string = ResourceLocation.readGreedy(reader);
    try {
      return ResourceLocation.parse(string);
    } catch (error) {
      reader.setCursor(cursor);
      throw error;
    }
  };

  static readNonEmpty(reader: StringReader) {
    const cursor = reader.getCursor();
    const string = ResourceLocation.readGreedy(reader);
    if (!string.length) {
      throw new Error("Error while reading ResourceLocation: Invalid ID");
    } else {
      try {
        return ResourceLocation.parse(string);
      } catch (error) {
        reader.setCursor(cursor);
        throw error;
      }
    }
  };

  static isAllowedInResourceLocation(character: string) {
    return character >= "0" && character <= "9"
        || character >= "a" && character <= "z"
        || character === "_"
        || character === ":"
        || character === "/"
        || character === "."
        || character === "-";
  };

  static isValidPath(path: string) {
    for (let i = 0; i < path.length; i++) {
      if (!ResourceLocation.validPathChar(path.charAt(i))) {
        return false;
      }
    }
    return true;
  };

  static isValidNamespace(namespace: string) {
    for (let i = 0; i < namespace.length; i++) {
      if (!ResourceLocation.validNamespaceChar(namespace.charAt(i))) {
        return false;
      }
    }
    return true;
  };

  static assertValidNamespace(namespace: string, path: string) {
    if (!ResourceLocation.isValidNamespace(namespace)) {
      // TODO normalize space
      throw new Error(`Non [a-z0-9_.-] character in namespace of location: ${namespace}:${path}`);
    } else {
      return namespace;
    }
  };

  static validPathChar(pathChar: string) {
    return pathChar === "_"
        || pathChar === "-"
        || pathChar >= "a" && pathChar <= "z"
        || pathChar >= "0" && pathChar <= "9"
        || pathChar === "/"
        || pathChar === ".";
  };

  static validNamespaceChar(namespaceChar: string) {
    return namespaceChar === "_"
        || namespaceChar === "-"
        || namespaceChar >= "a" && namespaceChar <= "z"
        || namespaceChar >= "0" && namespaceChar <= "9"
        || namespaceChar === ".";
  };

  static assertValidPath(namespace: string, path: string) {
    if (!ResourceLocation.isValidPath(path)) {
      throw new Error(`Non [a-z0-9/._-] character in path of location: ${namespace}:${path}`);
    } else {
      return path;
    }
  };
}
