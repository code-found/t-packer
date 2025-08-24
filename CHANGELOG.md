# t-packer

## 0.0.5

### Patch Changes

- c1d6a01: 0.0.5

  - fix bug of tranform with workspace
  - transform add export support: when try to find requires of a file , the export xx from case is missed before
  - node_modules add version support: add version support when transform node_modules

## 0.0.4

### Patch Changes

- 8713299: tranform feature add node modules support.

## 0.0.3

### Patch Changes

- 70d0c11: expose registry for subclassing and make transformSync truly synchronous

## 0.0.2

### Patch Changes

- 96f080f: add files to npm package

  - add src package.json README.md docs to the release package
  - change the bin file path to cjs

## 0.0.1

### Patch Changes

- f6685dc: release version 0.0.1

  - add assemble method to pack node package
  - add t-packer command to pack node package
  - add ModuleTransformer to transform code customization
