# Third-party notices for Uhm

The `uhm` model incorporates upstream pretrained speech-model components and public audio datasets. Their licenses apply to those components; nothing in the Desert Ant Labs Source-Available License overrides them.

## Model backbones

### DistilHuBERT

- **Source:** [`ntu-spml/distilhubert`](https://huggingface.co/ntu-spml/distilhubert)
- **License:** Apache License 2.0
- **Use in `uhm`:** Backbone for the shipped filler-word detection model, fine-tuned for frame-level filler classification.

### HuBERT-base lineage

- **Source:** [`facebook/hubert-base-ls960`](https://huggingface.co/facebook/hubert-base-ls960)
- **License:** Apache License 2.0
- **Use in `uhm`:** Upstream teacher/base architecture lineage for DistilHuBERT.

## Public datasets referenced during training/evaluation

### AMI Meeting Corpus

- **Source:** [`edinburghcstr/ami`](https://huggingface.co/datasets/edinburghcstr/ami)
- **License:** Creative Commons Attribution 4.0 International (CC BY 4.0)
- **Use in `uhm`:** Public meeting-speech fine-tuning/evaluation data.

### PodcastFillers

- **Source:** PodcastFillers benchmark, used for filler-event evaluation.
- **Use in `uhm`:** Evaluation only.

## Internal data

- Internal recordings produced by the Desert Ant Labs team, used under the team's internal license.

## Notices

The Apache License 2.0 requires preservation of any NOTICE files distributed with the upstream components. Where upstream Apache 2.0 components ship a NOTICE file, it is reproduced or referenced here.
