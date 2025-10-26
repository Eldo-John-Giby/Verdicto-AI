from transformers import AutoModelForSequenceClassification, AutoTokenizer
from torch.nn import functional as F
import torch
from typing import List


class LocalCrossEncoder:
    def __init__(self, model_name="cross-encoder/ms-marco-MiniLM-L-6-v2"):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        try:
            # Load tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=False)

            # Load model with proper configuration to avoid meta tensor issues
            self.model = AutoModelForSequenceClassification.from_pretrained(
                model_name,
                trust_remote_code=False,
                torch_dtype=torch.float32,  # Explicit dtype
                device_map=None  # Avoid auto device mapping that can cause meta tensor issues
            )

            # Move to device after loading
            self.model.to(self.device)
            self.model.eval()

            # Check model output dimensions
            with torch.no_grad():
                test_input = self.tokenizer(["test query", "test document"],
                                            return_tensors="pt",
                                            padding=True,
                                            truncation=True)
                test_output = self.model(**test_input.to(self.device))
                self.output_dim = test_output.logits.shape[-1]
                print(f"✅ Model loaded successfully. Output dimension: {self.output_dim}")

        except Exception as e:
            print(f"❌ Failed to load cross-encoder: {e}")
            raise

    def rerank(self, query: str, docs: List[str], top_k: int = 5) -> List[str]:
        if not docs:
            return []

        with torch.no_grad():
            # Create pairs of [query, doc]
            pairs = [[query, doc] for doc in docs]

            # Tokenize in batches to avoid memory issues
            batch_size = 32
            all_scores = []

            for i in range(0, len(pairs), batch_size):
                batch_pairs = pairs[i:i + batch_size]

                # Tokenize batch
                encodings = self.tokenizer(
                    batch_pairs,
                    padding=True,
                    truncation=True,
                    max_length=512,
                    return_tensors="pt"
                ).to(self.device)

                # Get model outputs
                outputs = self.model(**encodings)
                logits = outputs.logits

                # Handle different output dimensions
                if self.output_dim == 1:
                    # Single output (regression-style)
                    scores = torch.sigmoid(logits.squeeze(-1))
                else:
                    # Binary classification (2 outputs)
                    scores = F.softmax(logits, dim=1)[:, 1]  # Take positive class

                all_scores.extend(scores.cpu().tolist())

            # Combine docs with scores and sort
            scored_docs = list(zip(docs, all_scores))
            sorted_docs = sorted(scored_docs, key=lambda x: x[1], reverse=True)

            # Return top_k documents
            return [doc for doc, _ in sorted_docs[:top_k]]

    def predict(self, pairs: List[List[str]]) -> List[float]:
        """Alternative method that returns raw scores for compatibility"""
        if not pairs:
            return []

        with torch.no_grad():
            batch_size = 32
            all_scores = []

            for i in range(0, len(pairs), batch_size):
                batch_pairs = pairs[i:i + batch_size]

                # Tokenize batch
                encodings = self.tokenizer(
                    batch_pairs,
                    padding=True,
                    truncation=True,
                    max_length=512,
                    return_tensors="pt"
                ).to(self.device)

                # Get model outputs
                outputs = self.model(**encodings)
                logits = outputs.logits

                # Handle different output dimensions
                if self.output_dim == 1:
                    # Single output (regression-style)
                    scores = torch.sigmoid(logits.squeeze(-1))
                else:
                    # Binary classification (2 outputs)
                    scores = F.softmax(logits, dim=1)[:, 1]  # Take positive class

                all_scores.extend(scores.cpu().tolist())

            return all_scores


cross_encoder_instance: LocalCrossEncoder = None

def initialize_cross_encoder():
    global cross_encoder_instance
    if cross_encoder_instance is None:
        cross_encoder_instance = LocalCrossEncoder()
    return cross_encoder_instance