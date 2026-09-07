"""Adapt the pinned Uhm graph to six seconds without changing trained weights.

Usage: python scripts/prepare-speak-model.py ORIGINAL.onnx OUTPUT.onnx
Requires onnx 1.22.0 and numpy. Does not download assets or train a model.
"""
import hashlib
import sys
from pathlib import Path
import numpy as np
import onnx
from onnx import numpy_helper

source, destination = map(Path, sys.argv[1:3])
assert hashlib.sha256(source.read_bytes()).hexdigest() == 'c266faf7db4cdced6f18aa9119ff2800a20707d7159be645d487ec191a9d79ff', 'Unexpected upstream model'
model = onnx.load(source)
model.graph.input[0].type.tensor_type.shape.dim[1].dim_value = 96000
for output in model.graph.output:
    for dim in output.type.tensor_type.shape.dim:
        if dim.dim_value == 1499:
            dim.dim_value = 299
changes = 0
for node in model.graph.node:
    if node.op_type == 'Constant':
        for attribute in node.attribute:
            if attribute.name == 'value':
                value = numpy_helper.to_array(attribute.t)
                if value.dtype.kind == 'i' and (value == 1499).any():
                    attribute.t.CopyFrom(numpy_helper.from_array(np.where(value == 1499, 299, value).astype(value.dtype)))
                    changes += 1
assert changes == 6, changes
onnx.checker.check_model(model)
onnx.save(model, destination)
print(hashlib.sha256(destination.read_bytes()).hexdigest(), destination)
