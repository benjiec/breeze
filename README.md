A UI for Blast. Works with Giraffe-compatible Blast backends, such as Giraffe and Edge. In addition to displaying blast results and highlighting mismatches, this tool:

  * Groups blast results by hierarchical relationships among matched entries. For example, when using an Edge backend, if sequence matches to a parent genome as well as many derived genomes, this tool displays the result in the context of the parent genome and lists the derived genomes, rather than displaying each of the results. This feature requires providing the tool with a function that retrieves hierarchical relationships.

  * Works with queries with degenerate base pairs. This tool assumes the degenerate base pairs result in mismatches in alignments, detects and corrects such mismatches, and adjusts the identities score. Admittedly, this is hacky. But we don't know how to configure ncbi-blast+ tool with different alphabets and matching rules/scores.

How to load the relevant components: see breeze.html.
