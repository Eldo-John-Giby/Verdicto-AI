"""
=====================
⚠️DEPRECIATED FILE ⚠️
=====================

Not part of the main program anymore
"""

from qa_chain import get_qa_chain

# WE DONT NEED THIS USELESS FUNCTION
def run_query_pipeline(questions: list[str]) -> list[str]:
    """
    Executes a query pipeline on a list of input questions and returns corresponding answers.

    :param questions: A list of questions as strings that need to be processed.
    :return: A list of strings containing answers corresponding to each input question.
    """
    qa = get_qa_chain()
    answers = []
    for q in questions:
        result = qa({"query": q})
        answers.append(result["result"])
    return answers #

def main():
    # main function for  CLI testing
    print("🧠 Smart Legal Assistant: Indian Land Law")
    print("Ask any question about Indian land law. Type 'exit' to quit.\n")

    qa = get_qa_chain()

    while True:
        query = input("📝 Your question: ").strip()
        if query.lower() in ['exit', 'quit']:
            print("👋 Exiting. Goodbye!")
            break

        result = qa({"query": query})
        print("\n📘 Answer:\n", result['result'])

        print("\n📚 Sources:")
        for i, doc in enumerate(result['source_documents'], 1):
            source = doc.metadata.get('source', 'Unknown Source')
            page = doc.metadata.get('page', 'N/A')
            print(f"{i}. {source}, Page: {page}")
        print("\n" + "-"*60 + "\n")

if __name__ == "__main__":
    main()
